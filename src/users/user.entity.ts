import { Transaction } from "src/payments/transaction.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    googleId: string;

    @Column({ nullable: true })
    profilePicture: string;

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    transactions: Transaction[];
}