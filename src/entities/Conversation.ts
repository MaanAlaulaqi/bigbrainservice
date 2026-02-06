import { Column, Entity, ObjectIdColumn, ObjectId } from "typeorm";

export type ConversationMsg = {
  role: "user" | "assistant";
  content: string;
  ts: string;
};

@Entity("conversations")
export class Conversation {
  @ObjectIdColumn()
  public _id?: ObjectId;

  @Column()
  public orgId: string;

  @Column()
  public employeeId: string;

  @Column()
  public conversationId: string;

  @Column()
  public messages: ConversationMsg[];
    
  @Column()
  public createdAt: string;

  @Column()
  public updatedAt: string;
}
