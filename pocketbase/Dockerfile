FROM golang:1.23-alpine

WORKDIR /pb

COPY . .

RUN go mod tidy

RUN CGO_ENABLED=1 go build -o /pb/pocketbase

EXPOSE 8090

ENV GOMEMLIMIT=500MiB

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
