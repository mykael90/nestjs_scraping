import { Injectable, Logger } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Listing } from './entities/listing.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LocationsService } from '../locations/locations.service';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);
  constructor(
    @InjectModel('Listing') private readonly listingModel: Model<Listing>,
    private readonly locationsService: LocationsService,
  ) {}
  async create(createListingDto: CreateListingDto) {
    try {
      const categoryCreated = new this.listingModel(createListingDto);
      return await categoryCreated.save();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      return error;
    }
  }

  async createMany(listings: CreateListingDto[]) {
    try {
      return await this.listingModel.insertMany(listings);
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      return error;
    }
  }

  async findAll() {
    return await this.listingModel.find();
  }

  async findAllByNeighbourhood(neighborhood: string) {
    const location =
      await this.locationsService.findOneByNeighborhood(neighborhood);

    if (!location) {
      return;
    }

    return await this.listingModel
      .find()
      .where('locationId')
      .in([location._id]);
  }

  async findOne(id: Types.ObjectId) {
    return await this.listingModel.findById(id);
  }

  async update(id: Types.ObjectId, updateListingDto: UpdateListingDto) {
    return await this.listingModel.findByIdAndUpdate(id, updateListingDto);
  }

  async remove(id: Types.ObjectId) {
    return `This action removes a #${id} listing`;
  }
}
