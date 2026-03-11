import { Component, signal, OnInit } from '@angular/core';
import { ToyModel } from '../../models/toy.model';
import { RouterLink } from "@angular/router";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { ToyService } from '../services/toy.service';
import { Loading } from '../loading/loading';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    Loading,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    CommonModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  searchNaziv = ''
  searchOpis = ''
  searchTip = ''
  searchUzrast = ''
  searchCiljnaGrupa = ''
  searchDatumProizvodnje = ''
  searchCenaMin = ''
  searchCenaMax = ''
  searchMinRating = ''

  public authService = AuthService
  toys = signal<ToyModel[]>([])
  filteredToys = signal<ToyModel[]>([])
  toyTypes = signal<string[]>([])
  ageGroups = signal<string[]>([])
  isLoading = signal(true)
  
  // Paginacija
  pageSize = 8 // 2 reda x 4 kolone = 8 igračaka
  pageIndex = 0
  paginatedToys = signal<ToyModel[]>([])

  getTotalPages(): number {
    return Math.ceil(this.filteredToys().length / this.pageSize)
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages()
    const pages: number[] = []
    for (let i = 0; i < total; i++) {
      pages.push(i + 1)
    }
    return pages
  }

  goToPage(page: number) {
    this.pageIndex = page - 1
    this.updatePaginatedToys()
  }

  previousPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--
      this.updatePaginatedToys()
    }
  }

  nextPage() {
    if (this.pageIndex < this.getTotalPages() - 1) {
      this.pageIndex++
      this.updatePaginatedToys()
    }
  }

  constructor() {}

  async ngOnInit() {
    try {
      console.log('Loading toys...')
      const [allToys, types, ageGroups] = await Promise.all([
        ToyService.getToys(),
        ToyService.getToyTypes(),
        ToyService.getAgeGroups()
      ])
      
      console.log('Loaded toys:', allToys.length)
      if (allToys.length > 0) {
        console.log('Sample toy:', allToys[0])
        console.log('Toy keys:', Object.keys(allToys[0]))
      } else {
        console.warn('No toys loaded!')
      }
      
      this.toys.set(allToys)
      this.filteredToys.set(allToys)
      this.toyTypes.set(types)
      this.ageGroups.set(ageGroups)
      this.updatePaginatedToys()
      this.isLoading.set(false)
    } catch (error: any) {
      console.error('Greška pri učitavanju igračaka:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }
      this.toys.set([])
      this.filteredToys.set([])
      this.isLoading.set(false)
    }
  }

  getToyTypes(): string[] {
    return this.toyTypes()
  }

  getAgeGroups(): string[] {
    return this.ageGroups()
  }

  getTargetGroups(): string[] {
    return ['devojčica', 'dečak', 'svi']
  }

  filter() {
    const criteria: any = {}

    if (this.searchNaziv) {
      criteria.naziv = this.searchNaziv
    }
    if (this.searchOpis) {
      criteria.opis = this.searchOpis
    }
    if (this.searchTip) {
      criteria.tip = this.searchTip
    }
    if (this.searchUzrast) {
      criteria.uzrast = this.searchUzrast
    }
    if (this.searchCiljnaGrupa) {
      criteria.ciljnaGrupa = this.searchCiljnaGrupa
    }
    if (this.searchDatumProizvodnje) {
      criteria.datumProizvodnje = this.searchDatumProizvodnje
    }
    if (this.searchCenaMin) {
      criteria.cenaMin = parseFloat(this.searchCenaMin)
    }
    if (this.searchCenaMax) {
      criteria.cenaMax = parseFloat(this.searchCenaMax)
    }
    if (this.searchMinRating) {
      criteria.minRating = parseFloat(this.searchMinRating)
    }

    const filtered = ToyService.searchToys(this.toys(), criteria)
    this.filteredToys.set(filtered)
    this.pageIndex = 0
    this.updatePaginatedToys()
  }

  clearFilters() {
    this.searchNaziv = ''
    this.searchOpis = ''
    this.searchTip = ''
    this.searchUzrast = ''
    this.searchCiljnaGrupa = ''
    this.searchDatumProizvodnje = ''
    this.searchCenaMin = ''
    this.searchCenaMax = ''
    this.searchMinRating = ''
    this.filteredToys.set(this.toys())
    this.pageIndex = 0
    this.updatePaginatedToys()
  }

  updatePaginatedToys() {
    const startIndex = this.pageIndex * this.pageSize
    const endIndex = startIndex + this.pageSize
    const paginated = this.filteredToys().slice(startIndex, endIndex)
    this.paginatedToys.set(paginated)
  }


  getAverageRating(toy: ToyModel): number {
    if (!toy.recenzije || toy.recenzije.length === 0) return 0
    const sum = toy.recenzije.reduce((acc, r) => acc + r.rating, 0)
    return sum / toy.recenzije.length
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('sr-RS')} RSD`
  }

  getImageUrl(toy: ToyModel): string {
    return ToyService.getImageUrl(toy)
  }

  reserveToy(toy: ToyModel) {
    if (!AuthService.getActiveUser()) {
      return
    }
    AuthService.createReservation(toy)
    alert(`Igračka "${toy.naziv}" je dodata u korpu rezervacija!`)
  }
}
