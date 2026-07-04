package com.ctav.api.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class GlobalExceptionHandler {

    @Provider
    public static class ResourceNotFoundExceptionMapper
            implements ExceptionMapper<ResourceNotFoundException> {

        @Override
        public Response toResponse(ResourceNotFoundException ex) {
            return buildResponse(Response.Status.NOT_FOUND, ex.getMessage());
        }
    }

    @Provider
    public static class BusinessExceptionMapper
            implements ExceptionMapper<BusinessException> {

        @Override
        public Response toResponse(BusinessException ex) {
            return buildResponse(Response.Status.BAD_REQUEST, ex.getMessage());
        }
    }

    @Provider
    public static class ConstraintViolationExceptionMapper
            implements ExceptionMapper<ConstraintViolationException> {

        @Override
        public Response toResponse(ConstraintViolationException ex) {
            Map<String, String> errors = new HashMap<>();
            for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
                String path = v.getPropertyPath().toString();
                String field = path.contains(".")
                        ? path.substring(path.lastIndexOf('.') + 1)
                        : path;
                errors.put(field, v.getMessage());
            }

            Map<String, Object> body = new HashMap<>();
            body.put("timestamp", LocalDateTime.now());
            body.put("status", Response.Status.BAD_REQUEST.getStatusCode());
            body.put("error", "Erro de validação");
            body.put("fields", errors);

            return Response.status(Response.Status.BAD_REQUEST).entity(body).build();
        }
    }

    @Provider
    public static class GenericExceptionMapper implements ExceptionMapper<Exception> {

        @Override
        public Response toResponse(Exception ex) {
            if (ex instanceof jakarta.ws.rs.WebApplicationException wae) {
                return wae.getResponse();
            }
            return buildResponse(Response.Status.INTERNAL_SERVER_ERROR, ex.getMessage());
        }
    }

    private static Response buildResponse(Response.Status status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.getStatusCode());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return Response.status(status).entity(body).build();
    }
}
