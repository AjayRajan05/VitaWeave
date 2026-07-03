import { getAshaProfileStats, getDoctorProfileStats } from './profileStats';
import { notifyCareTeamDigest, notifyAppointmentReminder } from './notifications';
import { getDoctorAppointments } from './api';
import { formatAppointmentTime, isAppointmentToday } from './formatters';
import type { UserRole } from './roles';

export async function syncRoleNotifications(userId: string, role: UserRole): Promise<void> {
  if (role === 'asha') {
    const stats = await getAshaProfileStats(userId);
    await notifyCareTeamDigest({
      urgentTasks: stats.pendingTasks,
      highAlerts: stats.activeAlerts,
      dueVaccinations: stats.dueVaccinations,
    });
    return;
  }

  if (role === 'doctor') {
    const stats = await getDoctorProfileStats(userId);
    const appointments = await getDoctorAppointments(userId);
    const nextToday = appointments.find(
      (a) => isAppointmentToday(a.appointmentTime) && a.status === 'Scheduled'
    );
    if (nextToday) {
      await notifyAppointmentReminder(
        nextToday.patientName ?? 'Patient',
        formatAppointmentTime(nextToday.appointmentTime)
      );
    }
    if (stats.todayAppointments > 0) {
      await notifyCareTeamDigest({
        urgentTasks: stats.todayAppointments,
        highAlerts: 0,
      });
    }
  }
}
