import { AppDataSource } from "../config/data-source";
import { Coach } from "../entities/coach.entity";

export const seedCoaches = async () => {
  const coachRepository = AppDataSource.getRepository(Coach);
  
  const coachCount = await coachRepository.count();
  if (coachCount > 0) {
    console.log(`✅ ${coachCount} antrenör zaten mevcut, seed atlanıyor.`);
    return;
  }
  
  console.log("🎾 Antrenörler oluşturuluyor...");
  
  try {
    const coachesData = [
      {
        name: "Ahmet Yılmaz",
        specialty: "Tekler",
        experience: "15 yıl",
        rating: 4.8,
        hourlyRate: "₺200",
        availability: "Müsait",
        bio: "Profesyonel tenis oyuncusu ve antrenör. ATP turnuvalarında oynamış, şimdi genç yetenekleri yetiştiriyor.",
        languages: ["Türkçe", "İngilizce"],
        certifications: ["ATP Coach", "ITF Intermediate"],
        phone: "+905321234567",
      },
      {
        name: "Fatma Kaya",
        specialty: "Çiftler",
        experience: "12 yıl",
        rating: 4.9,
        hourlyRate: "₺180",
        availability: "Müsait",
        bio: "Çiftler oyununda uzmanlaşmış antrenör. Takım koordinasyonu ve strateji konularında deneyimli.",
        languages: ["Türkçe", "Almanca"],
        certifications: ["ITF Advanced", "Doubles Specialist"],
        phone: "+905359876543",
      },
      {
        name: "Mehmet Demir",
        specialty: "Başlangıç",
        experience: "8 yıl",
        rating: 4.7,
        hourlyRate: "₺150",
        availability: "Sınırlı",
        bio: "Yeni başlayanlar için ideal antrenör. Sabırlı ve anlayışlı yaklaşımıyla tanınıyor.",
        languages: ["Türkçe"],
        certifications: ["ITF Beginner", "Beginner Specialist"],
        phone: "+905052345678",
      },
      {
        name: "Ayşe Özkan",
        specialty: "İleri Seviye",
        experience: "20 yıl",
        rating: 5.0,
        hourlyRate: "₺250",
        availability: "Müsait",
        bio: "Elite seviye oyuncular için antrenör. Grand Slam turnuvalarında oyuncular yetiştirmiş.",
        languages: ["Türkçe", "İngilizce", "Fransızca"],
        certifications: ["ATP Elite Coach", "Grand Slam Experience"],
        phone: "+905418765432",
      },
    ];

    const coaches = coachRepository.create(coachesData);
    await coachRepository.save(coaches);
    
    console.log(`✅ ${coaches.length} antrenör oluşturuldu`);
  } catch (error) {
    console.error("❌ Antrenör oluşturma hatası:", error);
    throw error;
  }
};

