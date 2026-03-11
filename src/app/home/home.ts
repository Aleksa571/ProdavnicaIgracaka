import { Component, signal, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ToyModel } from '../../models/toy.model';
import { RouterLink, Router } from "@angular/router";
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
import { Alerts } from '../alerts';

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
export class Home implements OnInit, AfterViewInit {
  searchNaziv = ''
  searchOpis = ''
  searchTip = ''
  searchUzrast = ''
  searchCiljnaGrupa = ''
  searchDatumProizvodnje = ''
  searchCenaMin = ''
  searchCenaMax = ''
  searchMinRating = ''
  
  priceRange = signal<[number, number]>([0, 0])
  priceRangeMin = signal<number>(0)
  priceRangeMax = signal<number>(0)
  priceDistribution = signal<number[]>([])
  priceFilterExpanded = signal<boolean>(true)

  public authService = AuthService
  toys = signal<ToyModel[]>([])
  filteredToys = signal<ToyModel[]>([])
  toyTypes = signal<string[]>([])
  ageGroups = signal<string[]>([])
  isLoading = signal(true)
  
  pageSize = 8
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

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.isLoading.set(true)
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
      
      // Initialize price range
      const prices = allToys.map(t => t.cena || 0).filter(p => p > 0)
      if (prices.length > 0) {
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        this.priceRange.set([minPrice, maxPrice])
        this.priceRangeMin.set(minPrice)
        this.priceRangeMax.set(maxPrice)
        this.searchCenaMin = minPrice.toString()
        this.searchCenaMax = maxPrice.toString()
        this.calculatePriceDistribution(allToys, minPrice, maxPrice)
      }
      
      this.updatePaginatedToys()
      this.isLoading.set(false)
      
      // Force change detection to ensure UI updates
      this.cdr.detectChanges()
      
      setTimeout(() => {
        this.animateCards()
      }, 100)
    } catch (error: any) {
      console.error('Greška pri učitavanju igračaka:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }
      this.toys.set([])
      this.filteredToys.set([])
      this.isLoading.set(false)
      this.cdr.detectChanges()
    }
  }

  ngAfterViewInit() {
    this.setupScrollAnimations()
  }

  animateCards() {
    const cards = document.querySelectorAll('.toy-card')
    cards.forEach((card, index) => {
      setTimeout(() => {
        (card as HTMLElement).style.opacity = '1'
      }, index * 100)
    })
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    setTimeout(() => {
      document.querySelectorAll('.toy-card, .details-card, .user-card').forEach(el => {
        el.classList.add('animate-on-scroll')
        observer.observe(el)
      })
    }, 500)
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

  calculatePriceDistribution(toys: ToyModel[], minPrice: number, maxPrice: number) {
    const buckets = 20
    const bucketSize = (maxPrice - minPrice) / buckets
    const distribution = new Array(buckets).fill(0)
    
    toys.forEach(toy => {
      const price = toy.cena || 0
      if (price >= minPrice && price <= maxPrice) {
        const bucketIndex = Math.min(
          Math.floor((price - minPrice) / bucketSize),
          buckets - 1
        )
        distribution[bucketIndex]++
      }
    })
    
    this.priceDistribution.set(distribution)
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0
  }

  formatPriceValue(value: number): string {
    return value.toLocaleString('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  onMinPriceChange(value: string) {
    const numValue = parseFloat(value) || this.priceRange()[0]
    const maxValue = this.priceRangeMax()
    if (numValue > maxValue) {
      this.priceRangeMin.set(maxValue)
      this.searchCenaMin = maxValue.toString()
    } else {
      this.priceRangeMin.set(numValue)
      this.searchCenaMin = numValue.toString()
    }
    this.filter()
  }

  onMaxPriceChange(value: string) {
    const numValue = parseFloat(value) || this.priceRange()[1]
    const minValue = this.priceRangeMin()
    if (numValue < minValue) {
      this.priceRangeMax.set(minValue)
      this.searchCenaMax = minValue.toString()
    } else {
      this.priceRangeMax.set(numValue)
      this.searchCenaMax = numValue.toString()
    }
    this.filter()
  }

  getMaxDistributionValue(): number {
    const dist = this.priceDistribution()
    return dist.length > 0 ? Math.max(...dist) : 1
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
    
    // Update price distribution based on all toys (to show full range)
    const rangeMin = this.priceRange()[0]
    const rangeMax = this.priceRange()[1]
    this.calculatePriceDistribution(this.toys(), rangeMin, rangeMax)
    
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
    const [minPrice, maxPrice] = this.priceRange()
    this.searchCenaMin = minPrice.toString()
    this.searchCenaMax = maxPrice.toString()
    this.priceRangeMin.set(minPrice)
    this.priceRangeMax.set(maxPrice)
    this.searchMinRating = ''
    this.filteredToys.set(this.toys())
    this.calculatePriceDistribution(this.toys(), minPrice, maxPrice)
    this.pageIndex = 0
    this.updatePaginatedToys()
  }

  updatePaginatedToys() {
    const startIndex = this.pageIndex * this.pageSize
    const endIndex = startIndex + this.pageSize
    const paginated = this.filteredToys().slice(startIndex, endIndex)
    this.paginatedToys.set(paginated)
    
    setTimeout(() => {
      this.animateCards()
    }, 100)
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

  isToyReserved(toy: ToyModel): boolean {
    if (!toy.id) return false
    return AuthService.isToyReservedByAnyUser(toy.id)
  }

  reserveToy(toy: ToyModel) {
    if (!AuthService.getActiveUser()) {
      Alerts.error('Morate se prijaviti da biste rezervisali igračku!')
      this.router.navigate(['/login'])
      return
    }
    
    if (!toy.id) {
      Alerts.error('Igračka nema validan ID. Ne možete je rezervisati.')
      return
    }

    // Proveri da li je igračka već rezervisana od strane bilo kog korisnika
    const isReservedByAnyUser = AuthService.isToyReservedByAnyUser(toy.id)
    
    if (isReservedByAnyUser) {
      // Proveri da li je rezervisana od strane trenutnog korisnika
      const existingReservations = AuthService.getAllReservations()
      const alreadyReservedByMe = existingReservations.some(
        r => r.toyId === toy.id && r.status !== 'otkazano'
      )
      
      if (alreadyReservedByMe) {
        Alerts.error('Ova igračka je već u vašoj korpi!')
        this.router.navigate(['/korpa'])
      } else {
        Alerts.error('Ova igračka je već rezervisana od strane drugog korisnika!')
      }
      return
    }

    try {
      AuthService.createReservation(toy)
      Alerts.success(`Igračka "${toy.naziv}" je dodata u korpu rezervacija!`)
      setTimeout(() => {
        this.router.navigate(['/korpa'])
      }, 500)
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      Alerts.error('Greška pri rezervaciji igračke. Pokušajte ponovo.')
    }
  }
}
