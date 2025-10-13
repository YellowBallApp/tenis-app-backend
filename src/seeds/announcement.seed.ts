import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { Announcement } from '../entities/announcement.entity';

export const seedAnnouncements = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const announcementRepository = AppDataSource.getRepository(Announcement);

  console.log('📢 Duyuru verileri oluşturuluyor...');

  const users = await userRepository.find();

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  const admin = users[0]; // İlk kullanıcıyı admin olarak kullan

  const announcements = [
    {
      title: 'Defi Ligi 2025 Sezonu Başladı! 🎾',
      content: 'Yeni sezon heyecanı başladı! Tüm üyelerimize başarılar dileriz. Sıralamada yükselmek için maçlarınızı planlamaya başlayabilirsiniz.',
      author: admin,
      targetGroup: 'all',
      isPinned: true,
    },
    {
      title: 'Kort Bakım Çalışması',
      content: '15 Şubat Cumartesi günü 1 numaralı kort bakım çalışması nedeniyle kapalı olacaktır. Rezervasyonlarınızı buna göre planlayınız.',
      author: admin,
      targetGroup: 'all',
      isPinned: false,
    },
    {
      title: 'Yılın İlk Turnuvası',
      content: 'Mart ayında düzenlenecek olan eliminasyon turnuvası için kayıtlar başladı. Detaylar için yönetimle iletişime geçebilirsiniz.',
      author: admin,
      targetGroup: 'all',
      isPinned: false,
    },
  ];

  for (const annData of announcements) {
    const announcement = announcementRepository.create(annData);
    await announcementRepository.save(announcement);
    console.log(`✅ ${annData.title}`);
  }

  console.log('✅ Duyuru verileri oluşturuldu!');
};

