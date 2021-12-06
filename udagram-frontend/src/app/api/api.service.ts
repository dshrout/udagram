import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpEvent } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

const API_HOST = environment.apiHost;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  token: string;

  constructor(private http: HttpClient) {
  }

  static handleError(error: Error) {
    alert(error.message);
  }

  static extractData(res: HttpEvent<any>) {
    const body = res;
    return body || { };
  }

  setAuthToken(token) {
    this.httpOptions.headers = this.httpOptions.headers.append('Authorization', `jwt ${token}`);
    this.token = token;
  }

  get(endpoint): Promise<any> {
    const url = `${API_HOST}${endpoint}`;
    console.log("full url: url = ", url);

    const req = this.http.get(url, this.httpOptions).pipe(map(ApiService.extractData));
    console.log("request: req = ", req);

    return req
            .toPromise()
            .catch((e) => {
              console.log("exception: ", e);
              ApiService.handleError(e);
              throw e;
            });
  }

  post(endpoint, data): Promise<any> {
    console.log("post(endpoint, data): endpoint = ", endpoint);
    console.log("post(endpoint, data): data = ", data);
    const url = `${API_HOST}${endpoint}`;
    return this.http.post<HttpEvent<any>>(url, data, this.httpOptions)
            .toPromise()
            .catch((e) => {
              ApiService.handleError(e);
              throw e;
            });
  }

  async upload(endpoint: string, file: File, payload: any): Promise<any> {
    console.log("upload(endpoint, file, payload): endpoint = ", endpoint);
    console.log("upload(endpoint, file, payload): file = ", file);
    console.log("upload(endpoint, file, payload): payload = ", payload);

    const signed_url = (await this.get(`${endpoint}/signed-url/${file.name}`)).url;
    // console.log("signed_url = ", signed_url);

    const headers = new HttpHeaders({'Content-Type': file.type});
    // console.log("headers = ", headers);
    
    const req = new HttpRequest( 'PUT', signed_url, file,
                                  {
                                    headers: headers,
                                    reportProgress: true, // track progress
                                  });

    return new Promise ( resolve => {
        this.http.request(req).subscribe((resp) => {
        // if (resp && (<any> resp).status) {
        //   console.log("Response Status: ", (<any> resp).status);
        //   console.log("Response: ", resp);
        // }
        
        if (resp && (<any> resp).status && (<any> resp).status === 200) {
          resolve(this.post(endpoint, payload));
        } 
      });
    });
  }
}
