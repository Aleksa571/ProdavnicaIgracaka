export interface Review {
    author: string;
    rating: number;
    comment: string;
    date: string;
}

export type ToyType = 'slagalica' | 'slikovnica' | 'figura' | 'karakter' | 'igračka' | 'konstruktor' | 'lutka' | 'vozilo' | 'sport' | 'edukativna';
export type TargetGroup = 'devojčica' | 'dečak' | 'svi';
export type ReservationStatus = 'rezervisano' | 'pristiglo' | 'otkazano';

export interface ToyModel {
    id: number;
    naziv: string;
    opis: string;
    tip: ToyType;
    uzrast: string; 
    ciljnaGrupa: TargetGroup;
    datumProizvodnje: string; 
    cena: number;
    recenzije?: Review[];
    imageUrl?: string; 
}

export interface ReservationModel {
    toyId: number;
    naziv: string;
    opis: string;
    tip: ToyType;
    uzrast: string;
    ciljnaGrupa: TargetGroup;
    datumProizvodnje: string;
    cena: number;
    status: ReservationStatus;
    ocena?: number; 
    createdAt: string;
}
