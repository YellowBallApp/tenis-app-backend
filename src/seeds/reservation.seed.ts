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

  // En az 2 kullanıcı ve 1 kort olmalı
  if (users.length < 2) {
    console.log(`⚠️  En az 2 kullanıcı gerekli, şu anda ${users.length} kullanıcı var`);
    return;
  }

  if (courts.length < 1) {
    console.log(`⚠️  En az 1 kort gerekli, şu anda ${courts.length} kort var`);
    return;
  }

  // Bugün ve yarın için rezervasyonlar
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Güvenli array erişimi için - mevcut kullanıcı sayısına göre
  const getSafeUser = (index: number) => {
    if (users.length === 0) return null;
    if (index < users.length) return users[index];
    return users[index % users.length] || users[0];
  };
  
  const getSafeCourt = (index: number) => {
    if (courts.length === 0) return null;
    if (index < courts.length) return courts[index];
    return courts[index % courts.length] || courts[0];
  };

  const user0 = getSafeUser(0);
  const user1 = getSafeUser(1);
  const user2 = getSafeUser(2);
  const user3 = getSafeUser(3);
  const user4 = getSafeUser(4);

  const court0 = getSafeCourt(0);
  const court1 = getSafeCourt(1);

  // Null kontrolü
  if (!user0 || !court0) {
    console.log('⚠️  Kullanıcı veya kort bulunamadı');
    return;
  }

  const reservations = [
    {
      user: user0,
      court: court0,
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
      endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),  // 10:00
      participants: user1 ? [user1] : [],
      notes: user1?.name ? `Defi ligi maçı - Rakip: ${user1.name}` : 'Defi ligi maçı',
    },
    {
      user: user2 || user0,
      court: court1 || court0,
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
      endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),   // 11:00
      participants: user3 ? [user3] : [],
      notes: user3?.name ? `Antrenman - Partner: ${user3.name}` : 'Antrenman',
    },
    {
      user: user1 || user0,
      court: court0,
      startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000),   // 19:00
      participants: user4 ? [user4] : [],
      notes: user4?.name ? `Tekler maçı - Rakip: ${user4.name}` : 'Tekler maçı',
    },
  ];

  for (const resData of reservations) {
    try {
      const reservation = reservationRepository.create(resData);
      await reservationRepository.save(reservation);
      const courtName = resData.court?.name || 'Bilinmeyen Kort';
      const userName = resData.user?.name || 'Bilinmeyen Kullanıcı';
      console.log(`✅ ${courtName} - ${resData.startTime.getHours()}:00 (${userName})`);
    } catch (error) {
      console.error(`❌ Rezervasyon oluşturulurken hata:`, error);
    }
  }

  console.log('✅ Rezervasyon verileri oluşturuldu!');
};

