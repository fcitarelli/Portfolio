import requests
import warnings
import uvicorn
import pickle
import logging


from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from typing import Optional
from pydantic import BaseModel

"""

    Il codice si organizza come segue:
    1. impostazione il sistema di logs: strutturato in maniera analoga a quanto fatto nelle esercitazioni durante il corso. 
    
    2. definizione delle classi per la validazione dei dati di input e di output per la API
    
    3. definizione della funzione "load_model": strutturata per poter funzionare sia nel caso in cui l'utente sia in possesso del modello .pkl sia nel caso in cui non ne sia in possesso
    
    4. gestione degli errori: conforme a quanto proposto durante il corso
    
    5. definizione dell'endpoint: allineato con quello che è richiesto nella descrizione del progetto.
    Il modello viene caricato fuori dall'endpoint ("/identify-language"), questo perchè si vuole evitare che venga ricaricato più volte in contemporanea nel caso in cui venga utilizzato da più clienti in contemporanea

"""



warnings.filterwarnings("ignore")


MODEL_URL = "https://github.com/Profession-AI/progetti-python/raw/refs/heads/main/Messa%20in%20produzione%20di%20un%20sistema%20per%20il%20riconoscimento%20della%20lingua%20di%20testi%20per%20un%20museo/language_detection_pipeline.pkl"
MODEL_FILENAME = "language_detection_pipeline.pkl"
LOG_FILE = "museumlangapi.log"


#=========================================== imposto il sistema di logging =============================================
logging.basicConfig(format='[%(levelname)s]%(name)s - %(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S',
                    level=logging.DEBUG)
logger = logging.getLogger("MuseumLangAPI")

# Evito che vengano duplicati i logger
logger.propagate = False


file_handler = logging.FileHandler(LOG_FILE, mode = 'a', encoding = 'utf-8')
file_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter(
    '[%(levelname)s] %(name)s - %(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
#=======================================================================================================================


class InputData(BaseModel):
    text: str


class OutputData(BaseModel):
    language_name: Optional[str]
    confidence: Optional[float]


#=========================================== definizione della funzione per caricare il modello ========================
def load_model(model_path: str = MODEL_FILENAME, model_url: str = MODEL_URL):

    try:
        with open(model_path, 'rb') as file:
            model = pickle.load(file)
            logger.info(f"Modello caricato correttamente da {model_path}")
            return model

    except FileNotFoundError:
        logger.warning(f"Modello non trovato in {model_path}: verrà scaricato.")
        logger.info(f"Tento il Download del modello dall'url: {model_url}")

        try:
            resp = requests.get(model_url, stream=True, timeout=10)
            resp.raise_for_status()
            with open(model_path, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            logger.info(f"Download del modello in {model_path} completato")

        except Exception as e:
            logger.exception("Errore durante il download del modello")
            raise RuntimeError(f"Download fallito: {e}")

    # load del modello una volta scaricato
    try:
        with open(model_path, 'rb') as file:
            model = pickle.load(file)
            return model

    except Exception as e:
        logger.exception("Impossibile caricare il modello dopo il dowload")
        raise RuntimeError(f"Impossibile caricare il modello: {e}")



#========================================= Gestione dell'errore ========================================================
app = FastAPI(title = "MuseumLangAPI", version = "1.0")
model = load_model()



@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTPException ricevuto {exc.detail} - Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )

@app.exception_handler(Exception)
def exception_handler(request: Request, exc: Exception):
    logger.exception(f"Exception ricevuto {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content = {"error": "Errore interno del server"},
    )



@app.post("/identify-language")
def identify_language(data: InputData):

    if not data.text or not data.text.strip():
        logger.warning("Testo vuoto ricevuto dal client")
        raise HTTPException(status_code=400, detail="Il testo non può essere vuoto")

    text_input = [data.text]

    # inferenza del modello
    pred = model.predict(text_input)[0]
    proba = model.predict_proba(text_input)[0]

    class_index = list(model.classes_).index(pred)
    confidence = float(proba[class_index])

    if confidence < 0.8:
        raise HTTPException(status_code = 422, detail = "Lingua non riconosciuta")

    logger.info(
        f"Richiesta OK - testo: {data.text[:50]}, lingua: {pred}, confidenza: {confidence:.2f}"
    )

    return OutputData(language_name=pred, confidence=confidence)



if __name__ == "__main__":
    # main()
    uvicorn.run(app, host="0.0.0.0", port=8000)


