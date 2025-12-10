import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { Wallet } from "../wallet/wallet.entity";
import { ApiKey } from "../api-keys/api-key.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    googleId: string;

    @Column({ nullable: true, name: 'avatar' })
    avatar: string;

    @OneToMany(() => Wallet, (wallet) => wallet.user)
    wallets: Wallet[];

    @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
    apiKeys: ApiKey[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}