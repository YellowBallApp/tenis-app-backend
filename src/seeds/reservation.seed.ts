import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { Reservation } from '../entities/reservation.entity';
import { Court } from '../entities/court.entity';

export const seedReservations = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const reservationRepository = AppDataSource.getRepository(Reservation);
  const courtRepository = AppDataSource.getRepository(Court);

  console.log('📅 Rezervasyon verileri oluşturuluyor...');

  const users = await userRepository.find();
  const courts = await courtRepository.find();

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  if (courts.length === 0) {
    console.log('⚠️  Önce kort seedini çalıştırın');
    return;
  }

  // Bugün ve yarın için rezervasyonlar
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservations = [
    {
      user: users[0],
      court: courts[0], // Kort 1
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
      endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),  // 10:00
      participants: [users[1]],
      notes: `Defi ligi maçı - Rakip: ${users[1].name}`,
    },
    {
      user: users[2],
      court: courts[1], // Kort 2
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
      endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),   // 11:00
      participants: [users[3]],
      notes: `Antrenman - Partner: ${users[3].name}`,
    },
    {
      user: users[1],
      court: courts[0], // Kort 1
      startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000),   // 19:00
      participants: [users[4]],
      notes: `Tekler maçı- Rakip: ${users[4].name}`,
    },
  ];

  for (const resData of reservations) {
    const reservation = reservationRepository.create(resData);
    await reservationRepository.save(reservation);
    console.log(`✅ ${resData.court.name} - ${resData.startTime.getHours()}:00 (${resData.user.name})`);
  }

  console.log('✅ Rezervasyon verileri oluşturuldu!');
};

