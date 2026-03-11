export type ReservationStatus = 'rezervisano' | 'pristiglo' | 'otkazano';

export interface ReservationModel {
    toyId: number;
    naziv: string;
    opis: string;
    tip: string;
    uzrast: string;
    ciljnaGrupa: string;
    datumProizvodnje: string;
    cena: number;
    status: ReservationStatus;
    ocena?: number; 
    createdAt: string;
}
