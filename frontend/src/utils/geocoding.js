export const getLocalTime = () => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      date: now.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };