import { formatPhone } from "@qbs-autonaim/validators";

interface PhoneDisplayProps {
  phone: string | null | undefined;
  className?: string;
}

/**
 * Компонент для отображения телефона в отформатированном виде
 * @example <PhoneDisplay phone="79534633945" /> // +7 (953) 463-39-45
 */
export function PhoneDisplay({ phone, className }: PhoneDisplayProps) {
  if (!phone) return null;
  
  const formatted = formatPhone(phone);
  
  return (
    <a 
      href={`tel:${phone}`} 
      className={className}
      aria-label={`Позвонить по номеру ${formatted}`}
    >
      {formatted}
    </a>
  );
}
