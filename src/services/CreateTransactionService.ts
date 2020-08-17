// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository'
import CategoriesRepository from '../repositories/CategoriesRepository'
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface Request {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category_title: string;
}
class CreateTransactionService {
  private transactionsRepository : TransactionsRepository
  private categoriesRepository: CategoriesRepository
  public async execute({title,type,value, category_title}:Request): Promise<Transaction> {
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
    this.categoriesRepository = getCustomRepository(CategoriesRepository);

    if(!title){
      throw new AppError('Transaction title is required')
    }
    
    if(!type){
      throw new AppError('Transaction type is required')
    }

    if(!value){
      throw new AppError('Transaction value is required')
    }

    if(!category_title){
      throw new AppError('Transaction category is required')
    }

    const balance =  await this.transactionsRepository.getBalance();

    if(type === 'outcome' && balance.total  < value) {
      throw new AppError('Outcome Value greathen than total available')
    }
    const category =  await this.categoriesRepository.findOrCreate(category_title);

    const transaction = await this.transactionsRepository.create({
      title,
      value,
      type,
      category: category,
    })
    
    await this.transactionsRepository.save(transaction) 

    return transaction
    
  }
}

export default CreateTransactionService;
