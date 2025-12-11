import leagueTemplateRepository from '../repositories/leagueTemplate.repository';
import { LeagueTemplate } from '../entities/leagueTemplate.entity';
import { AppError } from '../utils/error/app.error';

export class LeagueTemplateService {
  async createTemplate(templateData: Partial<LeagueTemplate>): Promise<LeagueTemplate> {
    if (!templateData.name || templateData.name.trim() === '') {
      throw new AppError('VALIDATION_ERROR');
    }
    
    return await leagueTemplateRepository.create(templateData);
  }

  async findTemplateById(id: number): Promise<LeagueTemplate> {
    return await leagueTemplateRepository.findById(id);
  }

  async findAllTemplates(): Promise<LeagueTemplate[]> {
    return await leagueTemplateRepository.findAll();
  }

  async updateTemplate(id: number, templateData: Partial<LeagueTemplate>): Promise<LeagueTemplate> {
    return await leagueTemplateRepository.update(id, templateData);
  }

  async deleteTemplate(id: number): Promise<void> {
    await leagueTemplateRepository.delete(id);
  }
}

export default new LeagueTemplateService();

