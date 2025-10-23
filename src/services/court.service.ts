import { AppDataSource } from '../config/data-source';
import { Court } from '../entities/court.entity';
import { GroundType } from '../enum/groundType.enum';

export class CourtService {
  private courtRepository;

  constructor() {
    this.courtRepository = AppDataSource.getRepository(Court);
  }

  // Tüm kortları getir
  async getAllCourts() {
    try {
      const courts = await this.courtRepository.find({
        order: { id: 'ASC' },
      });
      return courts;
    } catch (error) {
      throw new Error('Kortlar alınırken bir hata oluştu');
    }
  }

  // Aktif kortları getir (closed = false)
  async getActiveCourts() {
    try {
      const courts = await this.courtRepository.find({
        where: { closed: false },
        order: { id: 'ASC' },
      });
      return courts;
    } catch (error) {
      throw new Error('Aktif kortlar alınırken bir hata oluştu');
    }
  }

  // ID'ye göre kort getir
  async getCourtById(id: number) {
    try {
      const court = await this.courtRepository.findOne({ where: { id } });
      if (!court) {
        throw new Error('Kort bulunamadı');
      }
      return court;
    } catch (error: any) {
      throw new Error(error.message || 'Kort alınırken bir hata oluştu');
    }
  }

  // Yeni kort oluştur
  async createCourt(data: {
    name: string;
    indoors?: boolean;
    groundType?: GroundType;
    closed?: boolean;
  }) {
    try {
      const court = this.courtRepository.create({
        name: data.name,
        indoors: data.indoors || false,
        groundType: data.groundType || GroundType.HARD,
        closed: data.closed || false,
      });

      return await this.courtRepository.save(court);
    } catch (error: any) {
      throw new Error(error.message || 'Kort oluşturulurken bir hata oluştu');
    }
  }

  // Kort güncelle
  async updateCourt(
    id: number,
    data: {
      name?: string;
      indoors?: boolean;
      groundType?: GroundType;
      closed?: boolean;
    }
  ) {
    try {
      const court = await this.getCourtById(id);

      if (data.name !== undefined) court.name = data.name;
      if (data.indoors !== undefined) court.indoors = data.indoors;
      if (data.groundType !== undefined) court.groundType = data.groundType;
      if (data.closed !== undefined) court.closed = data.closed;

      return await this.courtRepository.save(court);
    } catch (error: any) {
      throw new Error(error.message || 'Kort güncellenirken bir hata oluştu');
    }
  }

  // Kort sil
  async deleteCourt(id: number) {
    try {
      const court = await this.getCourtById(id);
      await this.courtRepository.remove(court);
      return { message: 'Kort başarıyla silindi' };
    } catch (error: any) {
      throw new Error(error.message || 'Kort silinirken bir hata oluştu');
    }
  }
}

