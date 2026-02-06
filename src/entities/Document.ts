import { Column, Entity, ObjectIdColumn, ObjectId } from "typeorm";


@Entity("documents")
export class DocumentEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  
  @Column()
  orgId: string;

  
  @Column()
  employeeId: string;

  
  @Column()
  docId: string;

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column()
  kind: "cv" | "certificate" | "other";

  @Column()
  source?: string;

  @Column()
  status: "uploaded" | "processed" | "failed";

  @Column()
  error?: string;

  @Column()
  createdAt: string;

  @Column()
  updatedAt: string;
}
