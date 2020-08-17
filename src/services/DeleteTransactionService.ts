import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import { getCustomRepository } from 'typeorm';

class DeleteTransactionService {
  public async execute(id:string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)

    if (typeof id !== 'string') {
      throw new AppError('id must be a string', 404);
    }
    const transaction = await transactionsRepository.findOne(id)

    if(!transaction) {
      throw new AppError('No transaction found for this ID')
    }

    await transactionsRepository.delete(id)
    

  }
}

export default DeleteTransactionService;
