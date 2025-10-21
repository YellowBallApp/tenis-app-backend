import { AppDataSource } from '../config/data-source';
import { Court } from '../entities/court.entity';
import { GroundType } from '../enum/groundType.enum';

export const seedCourts = async () => {
  const courtRepository = AppDataSource.getRepository(Court);

  // Mevcut kortları kontrol et
  const existingCourts = await courtRepository.find();

  if (existingCourts.length > 0) {
    console.log('Kortlar zaten mevcut, seed atlanıyor...');
    return;
  }

  const courts = [
    {
      name: 'Kort 1',
      indoors: false,
      groundType: GroundType.HARD,
      closed: false,
    },
    {
      name: 'Kort 2',
      indoors: false,
      groundType: GroundType.CLAY,
      closed: false,
    },
    {
      name: 'Kort 3',
      indoors: true,
      groundType: GroundType.HARD,
      closed: false,
    },
    {
      name: 'Kort 4',
      indoors: false,
      groundType: GroundType.GRASS,
      closed: true, // Bakımda
    },
    {
      name: 'Kort 5',
      indoors: true,
      groundType: GroundType.CLAY,
      closed: false,
    },
  ];

  for (const courtData of courts) {
    const court = courtRepository.create(courtData);
    await courtRepository.save(court);
  }

  console.log('✅ Kortlar başarıyla oluşturuldu');
};

