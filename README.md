# Projecto_UC605
Trabalho final da UC605 de Marco Candeias e Augusto Garcia

# O que é este Projecto?
Este projecto é um site de logistica, no qual um utilizador adiciona ou remove items da sua conta. cata item tem uma categuria e um preço.

__(Work in Progress)__

<br><br><hr><hr><br><br>

# Install and Run
Work in Progress (Ainda não funina lol!)
Para já basta abrir o ficheiro *__index.html__* no browser.

1º Deploy:
- Database SQL - Docker (Working)
- Database Redis - Docker (In Progress)
- RestAPI (C#) - no Visual Code (In Progress)
- Site (Backend + Frontend) - Docker (In Progress)

2º Aceder ao Site

<br><br><hr><hr><br><br>

## Deploy SQL Server on Docker
Links:
- https://hub.docker.com/_/mysql

Prerequesitos:
- Docker / Docker Desktop (you don't say...)
- Previlégios Sudo ^_^

Download da Image: (main recente do MySQL)
```sh
docker pull mysql
```

Criar o Conteiner:
```sh
docker run --name db_605_mysql -e MYSQL_ROOT_PASSWORD=123 -p 3333:3306 -d mysql:latest
```
Nota:
- Nome: db_605_mysql
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


<br><br><hr><hr><br><br>

# Road Map

Main:
- Criar Backend para falar com a RastAPI
- ligar front e back ends
- Autenticação e JWTs
- Criar a RastAPI
