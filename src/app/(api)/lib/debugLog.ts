import { User } from '@/schema/resources/user';

const debugusers: User['id'][] = ['user:fw76cv3j7csd1bh3rk5y'];
export const debugLogFactory = (user: User['id']) =>
    debugusers.includes(user) ? console.log : undefined;
