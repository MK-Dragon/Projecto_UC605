# Projecto_UC605
Trabalho final da UC605 de Marco Candeias e Augusto Garcia

# O que é este Projecto?
Este projecto é um site de logistica, no qual um utilizador adiciona ou remove items da sua conta. cata item tem uma categuria e um preço.

__(Work in Progress)__

<br><br><hr><hr><br><br>

# AUTO Run
Só correr o ficheiro Start_Server.py! ^_^

Ir ao site: http://localhost:3000

## AUTO Run for Testing
É só correr o Script Start_Server_Testing.py e testar contra as APIs do Imposter.


<br><br><hr><hr><br><br>

# Manual Install and Run

Correr Node Server:
- Abrir Terninal na pasta web_site
- correr ``` npm start ```

Correr Imposter de Autenticação:
- Abrir Terninal na MD_Imposter/MB
- correr ``` mb ```
- Correr ficheiro: MB_Imposter/TEST_Login_from_WebSite.http

Ir ao site: http://localhost:3000

-- // --

1º Deploy:
- Database SQL - Docker (Working)
    - Create DB ^_^
    - Load Test Data ^_^
- Database Redis - Docker (In Progress)
- RestAPI (C#) - no Visual Code (In Progress)
- Site (Backend + Frontend) - Docker (In Progress)

2º Aceder ao Site -> http://localhost:3000

--- // ---

# NPM Libs
- npm install axios
- npm install cors
- npm install express-session

<br><br><hr><hr><br><br>

## Deploy MySQL on Docker
Links:
- https://hub.docker.com/_/mysql

Prerequesitos:
- Docker / Docker Desktop (you don't say...)
- Previlégios Sudo ^_^

Download da Image: (main recente)
```sh
docker pull mysql
```

Criar o Conteiner:
```sh
docker run --name db_605_mysql -e MYSQL_ROOT_PASSWORD=123 -p 3333:3306 -d mysql:latest
```
Nota:
- Nome: db_605_mysql
- User: root
- Pass: 123
- Port: 3333

Mostrar contentores no Docker:
```sh
docker ps -a
```

Start Conteiner:
```sh
docker start db_605_mysql
```

## Deploy Redis on Docker
Links:
- https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/docker/
- https://hub.docker.com/_/redis

Download da Image: (main recente)
```sh
docker pull redis
```

Criar o Conteiner:
```sh
docker run --name db_605_redis -p 6379:6379 -d redis:latest
```

<br><br><hr><hr><br><br>

# Running Unittests
Ter Python instalado e PIP

### Virtualenv (ambiente virtual para Python)
Virtualenv é opcional mas recomendado, pois mantem todas as Libraries isuladas e impede que algo seja updated/downgraded por acidente.

1) Istalar 
```bash
pip install virtualenv
```

2) (__Linux__) Create VENV
```bash
python3 -m venv .venv
```

2) (__Windows__) Create VENV
```bash
python -m venv .venv
```

3) (__Linux__) Enter no VENV 
```bash
source .venv/bin/activate
```

3) (__Windows__) Enter no VENV 
```bash
.\venv\Scripts\Activate.ps1
```

4) Libraries a Instalar:
```bash
pip install requests
```


5) __Por fim Correr script de testes.__


<br><br><hr><hr><br><br>

