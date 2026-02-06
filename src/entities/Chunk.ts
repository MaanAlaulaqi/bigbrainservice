import { Column, Entity, ObjectIdColumn, ObjectId } from "typeorm";


@Entity("chunks")
export class ChunkEntity {
  @ObjectIdColumn()
  _id!: ObjectId;

  
  @Column()
  orgId!: string;

  
  @Column()
  employeeId!: string;

  
  @Column()
  docId!: string;

  @Column()
  chunkId!: string;

  @Column()
  text!: string;

  // For local Mongo, simplest is store vectors as number[]
  @Column()
  embedding!: number[];

  @Column()
  createdAt!: string;
}
