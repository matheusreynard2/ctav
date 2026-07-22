package com.ctav.api.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class JwtService {

    private static final String ISSUER = "ctav-api";

    @ConfigProperty(name = "app.auth.jwt.secret")
    String secret;

    @ConfigProperty(name = "app.auth.jwt.expiration-hours")
    long expirationHours;

    private Algorithm algorithm;
    private JWTVerifier verifier;

    @PostConstruct
    void init() {
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).withIssuer(ISSUER).build();
    }

    public String gerarToken(Long usuarioId, String username, String nome,
                             Integer permissaoId, Long contaId) {
        Instant agora = Instant.now();
        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(username)
                .withClaim("uid", usuarioId)
                .withClaim("nome", nome)
                .withClaim("perm", permissaoId)
                .withClaim("cid", contaId)
                .withIssuedAt(agora)
                .withExpiresAt(agora.plus(expirationHours, ChronoUnit.HOURS))
                .sign(algorithm);
    }

    public long getExpirationSegundos() {
        return expirationHours * 3600;
    }

    /** Valida o token e devolve o username (subject). Lanca excecao se invalido/expirado. */
    public DecodedJWT validar(String token) {
        return verifier.verify(token);
    }
}
