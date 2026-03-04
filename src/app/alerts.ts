import Swal from 'sweetalert2';
export class Alerts {
    static success(text: string) {
        Swal.fire({
            title: 'Success',
            text,
            icon: 'success'
        })
    }

    static error(text: string){
        Swal.fire({
            title:'Error',
            text,
            icon:'error'
        })
    }
}