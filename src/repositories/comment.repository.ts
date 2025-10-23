import { AppDataSource } from '../config/data-source';
import { CommentTextArea } from '../entities/commentTextArea';
import { Repository } from 'typeorm';

export class CommentRepository {
  private repository: Repository<CommentTextArea>;

  constructor() {
    this.repository = AppDataSource.getRepository(CommentTextArea);
  }

  async findAll(): Promise<CommentTextArea[]> {
    return this.repository.find({
      relations: ['user', 'matchHistory'],
      order: { created: 'DESC' },
    });
  }

  async findById(id: number): Promise<CommentTextArea | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'matchHistory'],
    });
  }

  async findByMatchHistoryId(matchHistoryId: number): Promise<CommentTextArea[]> {
    return this.repository.find({
      where: { matchHistory: { id: matchHistoryId } },
      relations: ['user', 'matchHistory'],
      order: { created: 'ASC' }, // Yorumları eskiden yeniye sıralı
    });
  }

  async findByUserId(userId: string): Promise<CommentTextArea[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user', 'matchHistory'],
      order: { created: 'DESC' },
    });
  }

  async create(data: Partial<CommentTextArea>): Promise<CommentTextArea> {
    const comment = this.repository.create(data);
    return this.repository.save(comment);
  }

  async update(id: number, data: Partial<CommentTextArea>): Promise<CommentTextArea> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Comment not found');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async countByMatchHistoryId(matchHistoryId: number): Promise<number> {
    return this.repository.count({
      where: { matchHistory: { id: matchHistoryId } },
    });
  }
}

export default new CommentRepository();

