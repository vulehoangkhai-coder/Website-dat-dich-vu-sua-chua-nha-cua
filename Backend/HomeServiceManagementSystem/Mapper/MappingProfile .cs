﻿using AutoMapper;
using HomeServiceManagementSystem.Dtos;
using HomeServiceManagementSystem.Models;

namespace HomeServiceManagementSystem.Mapper
{
    public class MappingProfile: Profile
    {

        public MappingProfile() {

            CreateMap<RegisterRequest, User>();
            CreateMap<User, MyInfoResponse>();
            CreateMap<ServiceCreationRequest, Service>();
            CreateMap<ServiceUpdateRequest, Service>()
            .ForAllMembers(opt =>
                opt.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Service, ServiceResponse>();
            CreateMap<PageResult<Service>, PageResult<ServiceResponse>>();
            CreateMap<RatingRequest, Rating>();
            CreateMap<PageResult<User>, PageResult<MyInfoResponse>>();
        }

    }
}
