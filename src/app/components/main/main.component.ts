import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
} from '@angular/core';
import { PokeapiService } from '../../services/pokeapi.service';
import { CardModule } from 'primeng/card';
import { InputGroup } from 'primeng/inputgroup';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-main',
  imports: [
    CardModule,
    InputGroup,
    ButtonModule,
    InputTextModule,
    CommonModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class MainComponent implements OnDestroy {
  pokemonNameOrId = signal('');
  loading = signal(false);
  pokemonData = signal<any>(null);
  actualIndex = signal(0);
  animationArray = signal<string[]>([]);
  animating = signal(false);

  actualImage = computed(() => {
    const array = this.animationArray();
    return array.length > 0 ? array[this.actualIndex()] : '';
  });

  constructor(
    private pokemonService: PokeapiService,
    private messageService: MessageService //private _snackBar: MatSnackBar
  ) {
    effect(() => {
      if (this.animating()) {
        this.animateFrames();
      }
    });
  }
  ngOnDestroy(): void {
    this.stopAnimation();
  }

  playSound(soundSource: string) {
    const audio = new Audio();
    audio.src = soundSource;
    audio.load();
    audio.play();
  }

  loadPokemon() {
    if (this.pokemonNameOrId().length > 0) {
      this.stopAnimation();
      this.loading.set(true);
      this.pokemonService.getPokemon(this.pokemonNameOrId()).subscribe({
        next: (pokemon: any) => {
          this.pokemonData.set(pokemon);
          this.loading.set(false);
          console.log(this.pokemonData());
          this.animationArray.set([
            pokemon.sprites.front_default,
            pokemon.sprites.back_default,
          ]);
          this.startAnimation();
          this.playSound(this.pokemonData().cries.latest);
        },
        error: (err: any) => {
          console.log(err);
          this.openSnackBarError();
          this.loading.set(false);
        },
      });
    } else {
      this.openSnackSinData();
    }
  }

  openSnackBarError() {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Pokémon name or ID is not valid',
    });
  }

  openSnackSinData() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warn',
      detail: 'Write a Polémon ID or name',
    });
  }

  startAnimation() {
    this.actualIndex.set(0);
    this.animating.set(true);
  }

  animateFrames() {
    setTimeout(() => {
      if (this.animating()) {
        this.actualIndex.update(
          (index) => (index + 1) % this.animationArray().length
        );
        this.animateFrames();
      }
    }, 1000);
  }

  stopAnimation() {
    this.animating.set(false);
  }
  updateName(name: string) {
    this.pokemonNameOrId.set(name.toLocaleLowerCase());
  }
}
