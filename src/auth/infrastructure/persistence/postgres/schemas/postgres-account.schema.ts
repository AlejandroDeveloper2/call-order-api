import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounts')
export class PostgresAccountSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: false })
  mustChangePassword!: boolean;

  @Column({ type: 'date' })
  lastLoginAt!: Date;

  @Column()
  failedAttempts!: number;

  @Column({ type: 'date', nullable: true })
  lockedUtil?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
