/**
 * Клонирует async iterable stream в два независимых потока,
 * сохраняя совместимость с AsyncIterableStream
 */
export function teeAsyncIterableStream<T>(
  source: AsyncIterable<T> & ReadableStream<T>,
): [
  AsyncIterable<T> & ReadableStream<T>,
  AsyncIterable<T> & ReadableStream<T>,
] {
  // Максимальный размер буфера для предотвращения неограниченного роста
  const MAX_BUFFER_SIZE = 100;

  // Буферы для каждого итератора - хранят значения, которые ещё не были прочитаны
  const buffers: [T[], T[]] = [[], []];
  let sourceIterator: AsyncIterator<T> | null = null;
  let sourceDone = false;
  // Mutex для предотвращения одновременного чтения из источника
  let readingPromise: Promise<IteratorResult<T>> | null = null;
  // Backpressure: promises для каждого буфера, разрешаются когда потребитель читает
  const bufferWaiters: [(Promise<void> | null), (Promise<void> | null)] = [null, null];
  const bufferResolvers: [(() => void) | null, (() => void) | null] = [null, null];

  async function readFromSource(): Promise<IteratorResult<T>> {
    if (!sourceIterator) {
      sourceIterator = source[Symbol.asyncIterator]();
    }
    return sourceIterator.next();
  }

  function makeIterator(index: 0 | 1): AsyncIterator<T> {
    return {
      async next(): Promise<IteratorResult<T>> {
        // Если есть буферизованные данные для этого итератора, вернуть их
        const buffer = buffers[index];
        if (buffer.length > 0) {
          const value = buffer.shift();
          // Разрешаем waiter для этого буфера, позволяя продюсеру продолжить
          if (bufferResolvers[index]) {
            bufferResolvers[index]!();
            bufferWaiters[index] = null;
            bufferResolvers[index] = null;
          }
          return { value, done: false };
        }

        // Если источник завершен, вернуть done
        if (sourceDone) {
          return { value: undefined as unknown as T, done: true };
        }

        // Атомарно проверяем и устанавливаем readingPromise
        // Если уже идёт чтение, ждём его завершения
        while (true) {
          if (readingPromise) {
            // Другой вызов уже читает - ждём его завершения
            await readingPromise;

            // После завершения чтения проверяем буфер снова
            if (buffer.length > 0) {
              const bufferedValue = buffer.shift();
              // Разрешаем waiter для этого буфера, позволяя продюсеру продолжить
              if (bufferResolvers[index]) {
                bufferResolvers[index]!();
                bufferWaiters[index] = null;
                bufferResolvers[index] = null;
              }
              return { value: bufferedValue, done: false };
            }
            if (sourceDone) {
              return { value: undefined as unknown as T, done: true };
            }
            // Если буфер пуст и источник не завершён, пробуем снова
            continue;
          }

          // readingPromise === null, атомарно устанавливаем его
          const currentReadPromise = readFromSource();
          readingPromise = currentReadPromise;

          try {
            const result = await currentReadPromise;

            if (result.done) {
              sourceDone = true;
              return { value: undefined as unknown as T, done: true };
            }

            // Добавляем значение в буфер другого итератора с backpressure
            const otherIndex = index === 0 ? 1 : 0;
            const otherBuffer = buffers[otherIndex];

            // Если буфер переполнен, ждём пока потребитель прочитает
            if (otherBuffer.length >= MAX_BUFFER_SIZE) {
              if (!bufferWaiters[otherIndex]) {
                bufferWaiters[otherIndex] = new Promise<void>((resolve) => {
                  bufferResolvers[otherIndex] = resolve;
                });
              }
              await bufferWaiters[otherIndex];
            }

            otherBuffer.push(result.value);

            // Возвращаем значение текущему итератору
            return { value: result.value, done: false };
          } finally {
            // Очищаем readingPromise только если это наш промис
            if (readingPromise === currentReadPromise) {
              readingPromise = null;
            }
          }
        }
      },
    };
  }

  // Создаем объекты, которые копируют все свойства источника
  const stream1 = Object.create(
    Object.getPrototypeOf(source),
  ) as AsyncIterable<T> & ReadableStream<T>;
  const stream2 = Object.create(
    Object.getPrototypeOf(source),
  ) as AsyncIterable<T> & ReadableStream<T>;

  // Копируем все свойства источника
  for (const key of Object.keys(source)) {
    (stream1 as unknown as Record<string, unknown>)[key] = (
      source as unknown as Record<string, unknown>
    )[key];
    (stream2 as unknown as Record<string, unknown>)[key] = (
      source as unknown as Record<string, unknown>
    )[key];
  }

  // Переопределяем Symbol.asyncIterator
  (stream1 as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = () =>
    makeIterator(0);
  (stream2 as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = () =>
    makeIterator(1);

  return [stream1, stream2];
}
