package com.ctav.api.controller;

import com.ctav.api.dto.AcolhidoRequestDTO;
import com.ctav.api.dto.AcolhidoResponseDTO;
import com.ctav.api.service.AcolhidoService;
import jakarta.validation.Valid;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/acolhidos")
@RequiredArgsConstructor
public class AcolhidoController {

    private final AcolhidoService acolhidoService;

    @PostMapping
    public ResponseEntity<AcolhidoResponseDTO> criar(@Valid @RequestBody AcolhidoRequestDTO dto) {
        AcolhidoResponseDTO criado = acolhidoService.criar(dto);
        return ResponseEntity.ok().body(criado);
    }

    @GetMapping
    public ResponseEntity<List<AcolhidoResponseDTO>> listar() {
        return ResponseEntity.ok(acolhidoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcolhidoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(acolhidoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcolhidoResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AcolhidoRequestDTO dto) {
        return ResponseEntity.ok(acolhidoService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        acolhidoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
