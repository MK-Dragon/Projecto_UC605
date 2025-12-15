# Projecto_UC605
Trabalho final da UC605 de Marco Candeias e Augusto Garcia

## O que é este Projecto?
Este projecto é um site de logistica, no qual um utilizador adiciona items. Cada item tem uma categuria. Este permite depois gerir a inventário de cada Produto em cada Loja.


<br><br><hr><hr><br><br>

# How to Run
1) Ligar o contentor com o MySQL
2) Ligar o contentor com o Redis
3) Correr a RestAPI em C#
4) Iniciar o Node Server / Start_Server.py liga o Servidor Node
5) Ir ao site: http://localhost:3000

Note: Python does not need external Libraries for this Script.

Resultado Final:
- Database - Docker
    - MySQL
    - Redis
- RestAPI (C#) - no Visual Code
- Site (Node => Backend + Frontend)

## Nota 1st Run:
A 1ª vez que corremos a RestAPi esta cria o ficheiro de configuração Project605_2/Project605_2/MyConnectionSettings.json. Este deve ser editado para Conter as cardencias, IPs e Ports para a base de dados MySQL e Redis. <br>
É importante também Correr o script DB/db_init_script.sql para criar a DataBase.

<br><br><hr><hr><br><br>

# Testing

## Testing WebSite:
É só correr o Script Start_Server_Testing.py e testar contra as APIs do Imposter.<br>
O script de Python inicia o Node Server, depois abre o MB e carrega os Imposters. <br>
Ir ao site: http://localhost:3000


### Maunul Testing (if needed):
Correr Node Server:
- Abrir Terninal na pasta web_site
- correr ``` npm start ``` ou 

Correr Imposter de Autenticação:
- Abrir Terninal na MD_Imposter/MB
- correr ``` mb ```
- Correr ficheiro: MB_Imposter/TEST_Login_from_WebSite.http

Ir ao site: http://localhost:3000

Nota: para corre este scrpit de Python é preciso instalar as Libraries. Ver Deployment e Dependencias.
<br><br>

## Testing RestAPI:
A forma mais facil é correr o Script: Unittesting_API_Calls/Test_RestAPI_Login_Auth_Logout.py. Este testa as funções base da API mostrando na consola os resultados. <br>
O Swagger, abre automaticamente ao correr a RestAPI e permite efetuar todos os testes manualmente.

<br><br><hr><hr><br><br>

# Depoyment and Dependacies

## Deploy MySQL in Docker
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

## Deploy Redis in Docker
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

# Python Dependacies
Ter Python 3.12 ou mais recente instalado e PIP

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



<br><br><hr><hr><br><br>

# NPM Libs Used
- npm install axios
- npm install cors
- npm install express-session