import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { LeagueTemplate } from "../entities/leagueTemplate.entity";

const repository = AppDataSource.getRepository(LeagueTemplate);

const leagueTemplateRepository = {
  create: async (templateData: Partial<LeagueTemplate>): Promise<LeagueTemplate> => {
    const template = repository.create(templateData);
    return await repository.save(template);
  },

  findById: async (id: number): Promise<LeagueTemplate> => {
    const template = await repository.findOne({
      where: { id },
    });
    if (!template) throw new AppError("LEAGUE_TEMPLATE_NOT_FOUND");
    return template;
  },

  findAll: async (): Promise<LeagueTemplate[]> => {
    return await repository.find({
      order: {
        id: 'DESC'
      }
    });
  },

  update: async (id: number, templateData: Partial<LeagueTemplate>): Promise<LeagueTemplate> => {
    const template = await repository.findOne({ where: { id } });
    if (!template) throw new AppError("LEAGUE_TEMPLATE_NOT_FOUND");
    
    Object.assign(template, templateData);
    return await repository.save(template);
  },

  delete: async (id: number): Promise<void> => {
    const result = await repository.delete(id);
    if (result.affected === 0) throw new AppError("LEAGUE_TEMPLATE_NOT_FOUND");
  },
};

export default leagueTemplateRepository;

