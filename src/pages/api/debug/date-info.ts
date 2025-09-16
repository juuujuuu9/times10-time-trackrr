import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Create array for each day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      weekDays.push({
        dayOfWeek: i,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
        date: dayDate.toISOString().split('T')[0],
        isToday: dayDate.toDateString() === now.toDateString()
      });
    }

    return new Response(JSON.stringify({
      currentTime: {
        now: now.toISOString(),
        localString: now.toString(),
        dayOfWeek: dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      },
      weekCalculation: {
        daysToSubtract: daysToSubtract,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      weekDays: weekDays,
      timezone: {
        offset: now.getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in date-info debug:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get date info',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
