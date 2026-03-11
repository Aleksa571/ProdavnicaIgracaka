import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterLink } from "@angular/router";
import { UserModel } from '../../models/user.model';
import { Alerts } from '../alerts';
import { AuthService } from '../services/auth.service';
import { ToyService } from '../services/toy.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    RouterLink,
    MatChipsModule,
    MatCheckboxModule,
    CommonModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit {
  user: Partial<UserModel> = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    password: '',
    omiljeneVrsteIgračaka: []
  }

  repeat: string = ''
  availableToyTypes: string[] = []
  isLoading = signal(true)

  constructor(public router: Router) {}

  async ngOnInit() {
    try {
      this.availableToyTypes = await ToyService.getToyTypes()
      this.isLoading.set(false)
    } catch (error) {
      console.error('Greška pri učitavanju tipova igračaka:', error)
      this.isLoading.set(false)
    }
  }

  isSelected(type: string): boolean {
    if (!this.user.omiljeneVrsteIgračaka) return false
    return this.user.omiljeneVrsteIgračaka.some((fav: any) => {
      if (typeof fav === 'string') {
        return fav === type
      } else if (fav && typeof fav === 'object') {
        const favStr = (fav as any).name || (fav as any).type || (fav as any).value || String(fav)
        return favStr === type
      }
      return String(fav) === type
    })
  }

  toggleFavoriteType(type: string) {
    if (!this.user.omiljeneVrsteIgračaka) {
      this.user.omiljeneVrsteIgračaka = []
    }
    
    const index = this.user.omiljeneVrsteIgračaka.findIndex((fav: any) => {
      if (typeof fav === 'string') {
        return fav === type
      } else if (fav && typeof fav === 'object') {
        const favStr = (fav as any).name || (fav as any).type || (fav as any).value || String(fav)
        return favStr === type
      }
      return String(fav) === type
    })
    
    if (index >= 0) {
      this.user.omiljeneVrsteIgračaka.splice(index, 1)
    } else {
      this.user.omiljeneVrsteIgračaka.push(type as any)
    }
  }

  doSignup() {
    if (AuthService.existsByEmail(this.user.email!)) {
      Alerts.error('Email je već registrovan!')
      return
    }

    if (this.user.firstName == '' || this.user.lastName == '' || this.user.address == '' || this.user.phone == '') {
      Alerts.error('Sva polja moraju biti popunjena!')
      return
    }

    if (this.user.password!.length < 6) {
      Alerts.error('Lozinka mora imati najmanje 6 karaktera!')
      return
    }

    if (this.user.password !== this.repeat) {
      Alerts.error('Lozinke se ne poklapaju!')
      return
    }

    AuthService.createUser(this.user)
    Alerts.success('Uspešno ste se registrovali!')
    this.router.navigate(['/login'])
  }
}
