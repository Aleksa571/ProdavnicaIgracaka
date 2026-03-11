import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Details } from './details/details';
import { Login } from './login/login';
import { User } from './user/user';
import { Order } from './order/order';
import { Cart } from './cart/cart';
import { Signup } from './signup/signup';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'about', component: About },
    { path: 'details/:id/order', component: Order },
    { path: 'details/:id', component: Details },
    { path: 'login', component: Login },
    { path: 'cart', component: Cart },
    { path: 'user', component: User },
    { path: 'signup', component: Signup }
];