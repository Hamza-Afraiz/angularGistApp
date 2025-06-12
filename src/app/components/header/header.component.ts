import { Component, OnDestroy, OnInit } from '@angular/core'; // Import OnInit
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Add this import
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../shared/search.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzAvatarModule } from 'ng-zorro-antd/avatar'; // Import NzAvatarModule
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'; // Import NzDropDownModule

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    NzInputModule,
    NzButtonModule,
    FormsModule,
    NzAvatarModule, // Add NzAvatarModule
    NzDropDownModule, // Add NzDropDownModule
    RouterModule, // Add this to the imports array
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy, OnInit {
  // Implement OnInit
  searchTerm = '';
  private searchInputSubject = new Subject<string>();
  private subscription!: Subscription;

  isLoggedIn = false; // Track login status
  user: { avatar_url: string; login: string } | null = null; // Store user info

  constructor(private searchService: SearchService) {
    this.subscription = this.searchInputSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchService.updateSearchTerm(term);
      });
  }

  ngOnInit(): void {
    // Simulate a logged-in user on initialization for demonstration
    // In a real app, you would check auth status here
    this.login();
  }

  onSearchInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchInputSubject.next(inputElement.value);
  }

  // Method to simulate login
  login(): void {
    this.isLoggedIn = true;
    // Placeholder user data - replace with actual data after authentication
    this.user = {
      avatar_url: 'https://avatars.githubusercontent.com/u/51757250?v=4', // Example avatar URL
      login: 'Hamza Afraiz',
    };
    console.log('User logged in:', this.user.login);
  }

  // Method to simulate logout
  logout(): void {
    this.isLoggedIn = false;
    this.user = null;
    console.log('User logged out');
    // Redirect or perform other logout actions
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
