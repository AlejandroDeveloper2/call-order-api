import { Injectable } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  create(createBranchDto: CreateBranchDto) {
    console.log('createBranchDto', createBranchDto);
    return 'This action adds a new branch';
  }

  findAll() {
    return `This action returns all branches`;
  }

  findOne(id: number) {
    console.log('id', id);
    return `This action returns a #${id} branch`;
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    console.log('id', id);
    console.log('updateBranchDto', updateBranchDto);
    return `This action updates a #${id} branch`;
  }

  remove(id: number) {
    console.log('id', id);
    return `This action removes a #${id} branch`;
  }
}
