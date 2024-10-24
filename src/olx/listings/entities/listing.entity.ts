import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'listings' })
export class Listing extends Document {
  _id: Types.ObjectId;

  @Prop()
  subject: string;

  @Prop()
  title: string;

  @Prop()
  price: string;

  @Prop({ unique: true })
  listId: string;

  @Prop()
  lastBumpAgeSecs: string;

  @Prop()
  oldPrice: string;

  @Prop()
  professionalAd: boolean;

  @Prop()
  priceReductionBadge: boolean;

  @Prop()
  userGoogleReviewsVisible: boolean;

  @Prop()
  userGoogleRating: number | null;

  @Prop()
  isFeatured: boolean;

  @Prop()
  listingCategoryId: string;

  @Prop({
    type: [
      {
        original: String,
        originalAlt: String,
        originalWebP: String,
        thumbnail: String,
      },
    ],
  })
  images: Array<{
    original: string;
    originalAlt: string;
    originalWebP: string;
    thumbnail: string;
  }>;

  @Prop()
  videoCount: number;

  @Prop()
  videos: string[];

  @Prop()
  isChatEnabled: boolean;

  @Prop()
  fixedOnTop: boolean;

  @Prop()
  url: string;

  @Prop()
  thumbnail: string;

  @Prop()
  date: Date;

  @Prop()
  imageCount: number;

  @Prop()
  location: string;

  @Prop({
    type: {
      municipality: String,
      municipalityId: Number,
      ddd: String,
      neighbourhood: String,
      uf: String,
      address: String,
      neighbourhoodId: Number,
      zone: String,
      zonId: Number,
      zipcode: String,
      mapLati: Number,
      mapLong: Number,
      streetCoordinates: Boolean,
    },
  })
  locationDetails: {
    municipality: string;
    municipalityId: number;
    ddd: string;
    neighbourhood: string;
    uf: string;
    address: string;
    neighbourhoodId: number;
    zone: string;
    zonId: number;
    zipcode: string;
    mapLati: number;
    mapLong: number;
    streetCoordinates: boolean;
  };

  @Prop()
  category: string;

  @Prop()
  searchCategoryLevelZero: number;

  @Prop()
  searchCategoryLevelOne: number;

  @Prop({
    type: [
      {
        name: String,
        label: String,
        value: String,
      },
    ],
  })
  properties: Array<{
    name: string;
    label: string;
    value: string;
  }>;

  @Prop({
    type: {
      isOnline: Boolean,
    },
  })
  accountActivityStatus: {
    isOnline: boolean;
  };

  @Prop({
    type: {
      enabled: Boolean,
      dynamicBadgeProps: Array,
      transactionalBadges: Array,
      installments: Array,
      isCategoryEligible: Boolean,
    },
  })
  olxPay: {
    enabled: boolean;
    dynamicBadgeProps: any[];
    transactionalBadges: any[];
    installments: any[];
    isCategoryEligible: boolean;
  };

  @Prop()
  olxPayBadgeEnabled: boolean;

  @Prop({
    type: {
      enabled: Boolean,
      weight: Number,
    },
  })
  olxDelivery: {
    enabled: boolean;
    weight: number | null;
  };

  @Prop()
  olxDeliveryBadgeEnabled: boolean;

  @Prop()
  installments: boolean;

  @Prop()
  isFavorited: boolean;

  @Prop()
  hasRealEstateHighlight: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Location' })
  locationId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({
    type: {
      userId: String,
      publicAccountId: String,
      name: String,
    },
  })
  user: {
    userId: string;
    publicAccountId: string;
    name: string;
  };

  @Prop({
    type: {
      phone: String,
      maskedPhone: String,
    },
  })
  phone: {
    phone: string;
    maskedPhone: string;
  };
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
