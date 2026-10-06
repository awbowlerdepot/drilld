/** Error body returned by the API with any 4xx/5xx status. */
export interface ApiErrorBody {
    error: string;
    /** Field-level validation problems (400). */
    issues?: { path: string; message: string }[];
}
