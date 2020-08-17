import csvParse from 'csv-parse'
import fs from 'fs';

import { getCustomRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';
import Category from '../models/Category';


interface CSVTransaction {
  title:string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {

  async execute(filepath: string): Promise<Transaction[]> {

    const readCSVStream = fs.createReadStream(filepath);
    const parserStream = csvParse({
      from_line: 2,
    });
    const parseCSV = readCSVStream.pipe(parserStream);

    const transactions: CSVTransaction[] = [];

    const categories : string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
          cell.trim(),
      );
      
      if(!title || !type || !value) return;
      categories.push(category);

      transactions.push({title,type,value,category})
    });

    await new Promise (resolve => parseCSV.on('end',resolve));

    const categoryRespository = getCustomRepository(CategoriesRepository);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const existentCategories = await categoryRespository.find({
      where: {
        title: In(categories),
      },
    })

    const existentCategoriesTitle = existentCategories.map((category:Category) => category.title);

    const addCategoryTitle = categories
    .filter(category => !existentCategoriesTitle.includes(category))
    .filter((value,index,self) => self.indexOf(value) === index);

    const newCategories = categoryRespository.create(addCategoryTitle.map(title => ({title})));
    await categoryRespository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories]

    console.log(finalCategories)
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => (
        {
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(category => category.title === transaction.category)
        }
      )),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filepath);

    return createdTransactions;
 }
}

export default ImportTransactionsService;
