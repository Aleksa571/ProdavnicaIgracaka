import Swal from "sweetalert2";

const matCustomClass = {
    popup: 'mat-swal-popup',
    title: 'mat-swal-title',
    actions: 'mat-swal-actions',
    confirmButton: 'mat-swal-confirm',
    cancelButton: 'mat-swal-cancel'
}

export class Alerts {
    static success(text: string) {
        Swal.fire({
            title: 'Success',
            text,
            icon: 'success',
            customClass: matCustomClass
        })
    }

    static error(text: string) {
        Swal.fire({
            title: 'Error',
            text,
            icon: 'error',
            customClass: matCustomClass
        })
    }

    static confirm(text: string, callback: Function) {
        Swal.fire({
            title: "Are you sure?",
            text,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes",
            customClass: matCustomClass
        }).then((result) => {
            if (result.isConfirmed) {
                callback()
            }
        })
    }
}