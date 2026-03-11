import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { DetaljiIgracke } from './details/details';
import { Login } from './login/login';
import { User } from './user/user';
import { Korpa } from './cart/cart';
import { Signup } from './signup/signup';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'about', component: About },
    { path: 'detalji/:id', component: DetaljiIgracke },
    { path: 'login', component: Login },
    { path: 'korpa', component: Korpa },
    { path: 'profil', component: User },
    { path: 'signup', component: Signup }
];
