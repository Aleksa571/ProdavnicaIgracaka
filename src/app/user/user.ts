import { Component, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Loading } from '../loading/loading';
import { Alerts } from '../alerts';
import { ToyModel } from '../../models/toy.model';
import { MatListModule } from '@angular/material/list';
import { ToyService } from '../services/toy.service';
import { UserModel } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatListModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    Loading,
    RouterLink,
    CommonModule
],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  public activeUser = AuthService.getActiveUser()
  recommended = signal<ToyModel[]>([])
  oldPassword = ''
  newPassword = ''
  passRepeat = ''
  availableToyTypes: string[] = []
  isLoading = signal(true)

  constructor(private router: Router) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }

    this.loadData()
  }

  async loadData() {
    try {
      this.availableToyTypes = await ToyService.getToyTypes()
      await this.loadRecommendedToys()
      this.isLoading.set(false)
    } catch (error) {
      console.error('Greška pri učitavanju podataka:', error)
      this.isLoading.set(false)
    }
  }

  async loadRecommendedToys() {
    if (!this.activeUser || !this.activeUser.omiljeneVrsteIgračaka || this.activeUser.omiljeneVrsteIgračaka.length === 0) {
      this.recommended.set([])
      return
    }

    try {
      const allToys = await ToyService.getToys()
      const recommended: ToyModel[] = []
      
      for (const favoriteType of this.activeUser.omiljeneVrsteIgračaka) {
        // Ekstraktuj string iz favoriteType ako je objekat
        const favTypeStr = typeof favoriteType === 'string' 
          ? favoriteType 
          : ((favoriteType as any)?.name || (favoriteType as any)?.type || (favoriteType as any)?.value || String(favoriteType))
        
        const toysOfType = allToys.filter(t => t.tip === favTypeStr)
        recommended.push(...toysOfType.slice(0, 3))
      }

      this.recommended.set(recommended.slice(0, 6))
    } catch (error) {
      console.error('Greška pri učitavanju preporučenih igračaka:', error)
    }
  }

  getAvatarUrl() {
    return `https://ui-avatars.com/api/?name=${this.activeUser?.firstName}+${this.activeUser?.lastName}`
  }

  isFavoriteType(type: string): boolean {
    if (!this.activeUser || !this.activeUser.omiljeneVrsteIgračaka) return false
    // Proveri da li je tip string ili objekat
    return this.activeUser.omiljeneVrsteIgračaka.some((fav: any) => {
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
    if (!this.activeUser) return
    
    if (!this.activeUser.omiljeneVrsteIgračaka) {
      this.activeUser.omiljeneVrsteIgračaka = []
    }
    
    const currentFavorites = this.activeUser.omiljeneVrsteIgračaka
    
    // Pronađi index - proveri i string i objekat format
    const index = currentFavorites.findIndex((fav: any) => {
      if (typeof fav === 'string') {
        return fav === type
      } else if (fav && typeof fav === 'object') {
        const favStr = (fav as any).name || (fav as any).type || (fav as any).value || String(fav)
        return favStr === type
      }
      return String(fav) === type
    })
    
    if (index >= 0) {
      currentFavorites.splice(index, 1)
    } else {
      // Dodaj kao string
      currentFavorites.push(type as any)
    }
    
    this.activeUser.omiljeneVrsteIgračaka = currentFavorites
  }

  updateUser() {
    Alerts.confirm('Da li ste sigurni da želite da ažurirate podatke profila?',
      () => {
        if (!this.activeUser) return
        AuthService.updateActiveUser(this.activeUser)
        Alerts.success('Profil je uspešno ažuriran')
        this.loadRecommendedToys()
      })
  }

  updatePassword() {
    Alerts.confirm('Da li ste sigurni da želite da promenite lozinku?',
      () => {
        if (this.oldPassword != this.activeUser?.password) {
          Alerts.error('Neispravna stara lozinka')
          return
        }

        if (this.newPassword.length < 6) {
          Alerts.error('Lozinka mora imati najmanje 6 karaktera')
          return
        }

        if (this.newPassword != this.passRepeat) {
          Alerts.error('Lozinke se ne poklapaju')
          return
        }

        if (this.newPassword == this.activeUser?.password) {
          Alerts.error('Nova lozinka ne može biti ista kao stara')
          return
        }

        AuthService.updateActiveUserPassword(this.newPassword)
        Alerts.success('Lozinka je uspešno promenjena')
        AuthService.logout()
        this.router.navigate(['/login'])
      })
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('sr-RS')} RSD`
  }
}
