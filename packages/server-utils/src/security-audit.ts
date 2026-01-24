/**
 * Security audit logging utility
 * Logs security events for monitoring and compliance
 */

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  
  // Authorization events
  ACCESS_DENIED = 'ACCESS_DENIED',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  ROLE_CHANGE = 'ROLE_CHANGE',
  
  // Data access events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  
  // Security violations
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  
  // System events
  SECURITY_CONFIG_CHANGE = 'SECURITY_CONFIG_CHANGE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // Maximum events to keep in memory

  private constructor() {}

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(securityEvent);

    // Keep only the latest events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in production (can be replaced with external logging service)
    if (process.env.NODE_ENV === 'production') {
      console.log('[SECURITY_AUDIT]', JSON.stringify(securityEvent));
    }

    // For critical events, also log with error level
    if (securityEvent.severity === 'critical') {
      console.error('[SECURITY_CRITICAL]', JSON.stringify(securityEvent));
    }
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEventType, limit = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string, limit = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: SecurityEvent['severity'], limit = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 100): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check for suspicious patterns
   */
  detectSuspiciousActivity(): {
    multipleFailedLogins: SecurityEvent[];
    rapidDataAccess: SecurityEvent[];
    unusualAccessPatterns: SecurityEvent[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentEvents = this.events.filter(event => event.timestamp >= oneHourAgo);

    // Multiple failed logins from same IP
    const failedLoginsByIP = recentEvents
      .filter(event => event.type === SecurityEventType.LOGIN_FAILED)
      .reduce((acc, event) => {
        const ip = event.ip || 'unknown';
        acc[ip] = (acc[ip] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const multipleFailedLogins = recentEvents.filter(event => 
      event.type === SecurityEventType.LOGIN_FAILED && 
      (failedLoginsByIP[event.ip || 'unknown'] || 0) >= 5
    );

    // Rapid data access (more than 100 data access events in 1 hour)
    const dataAccessEvents = recentEvents.filter(event => 
      event.type === SecurityEventType.DATA_ACCESS
    );

    // Unusual access patterns (access from multiple IPs in short time)
    const userIPs = recentEvents
      .filter(event => event.userId && event.type === SecurityEventType.LOGIN_SUCCESS)
      .reduce((acc, event) => {
        if (!acc[event.userId!]) {
          acc[event.userId!] = new Set();
        }
        if (event.ip) {
          acc[event.userId!]?.add(event.ip);
        }
        return acc;
      }, {} as Record<string, Set<string>>);

    const unusualAccessPatterns = recentEvents.filter(event => 
      event.userId && 
      userIPs[event.userId] && 
      (userIPs[event.userId]?.size || 0) > 3
    );

    return {
      multipleFailedLogins,
      rapidDataAccess: dataAccessEvents.slice(0, 100),
      unusualAccessPatterns,
    };
  }

  /**
   * Clear old events (older than specified days)
   */
  clearOldEvents(daysToKeep = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
  }

  /**
   * Get security statistics
   */
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<string, number>;
    recentActivity: {
      lastHour: number;
      last24Hours: number;
      last7Days: number;
    };
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);

    const eventsBySeverity = this.events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      recentActivity: {
        lastHour: this.events.filter(event => event.timestamp >= oneHourAgo).length,
        last24Hours: this.events.filter(event => event.timestamp >= oneDayAgo).length,
        last7Days: this.events.filter(event => event.timestamp >= sevenDaysAgo).length,
      },
    };
  }
}

// Export singleton instance
export const securityAuditLogger = SecurityAuditLogger.getInstance();

/**
 * Convenience functions for common security events
 */
export const logSecurityEvent = {
  loginSuccess: (userId: string, ip?: string, userAgent?: string) => {
    securityAuditLogger.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId,
      ip,
      userAgent,
      severity: 'low',
    });
  },

  loginFailed: (email?: string, ip?: string, userAgent?: string, reason?: string) => {
    securityAuditLogger.log({
      type: SecurityEventType.LOGIN_FAILED,
      ip,
      userAgent,
      details: { email, reason },
      severity: 'medium',
    });
  },

  accessDenied: (userId: string, resource: string, ip?: string) => {
    securityAuditLogger.log({
      type: SecurityEventType.ACCESS_DENIED,
      userId,
      ip,
      resource,
      severity: 'medium',
    });
  },

  suspiciousActivity: (details: Record<string, any>, ip?: string, userId?: string) => {
    securityAuditLogger.log({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      ip,
      details,
      severity: 'high',
    });
  },

  dataAccess: (userId: string, resource: string, action: string, ip?: string) => {
    securityAuditLogger.log({
      type: SecurityEventType.DATA_ACCESS,
      userId,
      ip,
      resource,
      action,
      severity: 'low',
    });
  },

  rateLimitExceeded: (ip?: string, userId?: string, endpoint?: string) => {
    securityAuditLogger.log({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      userId,
      ip,
      resource: endpoint,
      severity: 'medium',
    });
  },
};
