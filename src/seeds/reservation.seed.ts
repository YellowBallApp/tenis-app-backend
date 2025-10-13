import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { Reservation } from '../entities/reservation.entity';

export const seedReservations = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const reservationRepository = AppDataSource.getRepository(Reservation);

  console.log('📅 Rezervasyon verileri oluşturuluyor...');

  const users = await userRepository.find();

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  // Bugün ve yarın için rezervasyonlar
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservations = [
    {
      user: users[0],
      courtNumber: 1,
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
      endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),  // 10:00
      participants: [users[1].name],
      notes: 'Defi ligi maçı',
    },
    {
      user: users[2],
      courtNumber: 2,
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
      endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),   // 11:00
      participants: [users[3].name],
      notes: 'Antrenman',
    },
    {
      user: users[1],
      courtNumber: 1,
      startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14:00
      endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),   // 15:00
      participants: [],
    },
  ];

  for (const resData of reservations) {
    const reservation = reservationRepository.create(resData);
    await reservationRepository.save(reservation);
    console.log(`✅ Kort ${resData.courtNumber} - ${resData.startTime.getHours()}:00 (${resData.user.name})`);
  }

  console.log('✅ Rezervasyon verileri oluşturuldu!');
};

