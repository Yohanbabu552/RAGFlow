import { DataFlowSelect } from '@/components/data-pipeline-select';
import { ButtonLoading } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormLayout } from '@/constants/form';
import {
  useFetchTenantInfo,
  useFetchUserInfo,
} from '@/hooks/use-user-setting-request';
import { IModalProps } from '@/interfaces/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderKanban } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  ChunkMethodItem,
  EmbeddingModelItem,
  ParseTypeItem,
} from '../dataset/dataset-setting/configuration/common-item';

const FormId = 'dataset-creating-form';

export function InputForm({ onOk }: IModalProps<any>) {
  const { t } = useTranslation();
  const { data: tenantInfo } = useFetchTenantInfo();
  const { data: userInfo } = useFetchUserInfo();

  // Get user's project list for the dropdown
  const projectRoles = userInfo?.project_roles || [];

  const FormSchema = z
    .object({
      name: z
        .string()
        .min(1, {
          message: t('knowledgeList.namePlaceholder'),
        })
        .trim(),
      project_id: z.string().optional(),
      parseType: z.number().optional(),
      embd_id: z
        .string()
        .min(1, {
          message: t('knowledgeConfiguration.embeddingModelPlaceholder'),
        })
        .trim(),
      parser_id: z.string().optional(),
      pipeline_id: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      // When parseType === 1, parser_id is required
      if (
        data.parseType === 1 &&
        (!data.parser_id || data.parser_id.trim() === '')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('knowledgeList.parserRequired'),
          path: ['parser_id'],
        });
      }
      // When parseType === 1, pipline_id required
      if (data.parseType === 2 && !data.pipeline_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('knowledgeList.dataFlowRequired'),
          path: ['pipeline_id'],
        });
      }
    });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      project_id: projectRoles.length === 1 ? projectRoles[0].project_id : '',
      parseType: 1,
      parser_id: '',
      embd_id: tenantInfo?.embd_id,
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Clean up project_id — "none" or empty means no project
    const cleanData = {
      ...data,
      project_id:
        data.project_id && data.project_id !== 'none'
          ? data.project_id
          : undefined,
    };
    onOk?.(cleanData);
  }

  const parseType = useWatch({
    control: form.control,
    name: 'parseType',
  });

  useEffect(() => {
    console.log('parseType', parseType);
    if (parseType === 1) {
      form.setValue('pipeline_id', '');
    }
  }, [parseType, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        id={FormId}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="text-destructive mr-1"> *</span>
                {t('knowledgeList.name')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('knowledgeList.namePlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project selector — only shown when user has projects */}
        {projectRoles.length > 0 && (
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <FolderKanban className="size-3.5" />
                  Project
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projectRoles.map((pr) => (
                      <SelectItem key={pr.project_id} value={pr.project_id}>
                        {pr.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <EmbeddingModelItem line={2} isEdit={false} />
        <ParseTypeItem />
        {parseType === 1 && <ChunkMethodItem></ChunkMethodItem>}
        {parseType === 2 && (
          <DataFlowSelect
            isMult={false}
            showToDataPipeline={true}
            formFieldName="pipeline_id"
            layout={FormLayout.Vertical}
          />
        )}
      </form>
    </Form>
  );
}

export function DatasetCreatingDialog({
  hideModal,
  onOk,
  loading,
}: IModalProps<any>) {
  const { t } = useTranslation();

  return (
    <Dialog open onOpenChange={hideModal}>
      <DialogContent
        className="sm:max-w-[425px] focus-visible:!outline-none flex flex-col"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = document.getElementById(FormId) as HTMLFormElement;
            form?.requestSubmit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('knowledgeList.createKnowledgeBase')}</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        <InputForm onOk={onOk}></InputForm>
        <DialogFooter>
          <ButtonLoading type="submit" form={FormId} loading={loading}>
            {t('common.save')}
          </ButtonLoading>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
