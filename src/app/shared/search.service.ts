// src/app/shared/search.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchTermSubject = new BehaviorSubject<string>(''); // Holds the current search term, starts empty
  searchTerm$: Observable<string> = this.searchTermSubject.asObservable(); // Expose as Observable

  constructor() { }

  // Method to update the search term
  updateSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }
}