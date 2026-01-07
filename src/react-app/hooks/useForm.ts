/**
 * 表单状态管理 Hook
 * 统一管理表单的值、错误、验证等
 */

import { useState, useCallback } from "react";

export interface UseFormReturn<T> {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	handleChange: (field: keyof T) => (value: any) => void;
	handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
	reset: (newValues?: T) => void;
	setFieldValue: (field: keyof T, value: any) => void;
	setError: (field: keyof T, error: string) => void;
	clearErrors: () => void;
}

export interface ValidationRule<T> {
	required?: boolean;
	pattern?: RegExp;
	min?: number;
	max?: number;
	custom?: (value: any, values: T) => string | undefined;
	message?: string;
}

export interface UseFormOptions<T> {
	initialValues: T;
	validate?: (values: T) => Partial<Record<keyof T, string>>;
	rules?: Partial<Record<keyof T, ValidationRule<T>[]>>;
}

/**
 * 表单状态管理 Hook
 *
 * @example
 * ```tsx
 * interface UserFormValues {
 *   username: string;
 *   email: string;
 *   age: number;
 * }
 *
 * const form = useForm<UserFormValues>({
 *   initialValues: { username: '', email: '', age: 0 },
 *   rules: {
 *     username: [
 *       { required: true, message: '请输入用户名' },
 *       { min: 3, message: '用户名至少3个字符' },
 *     ],
 *     email: [
 *       { required: true, message: '请输入邮箱' },
 *       { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
 *     ],
 *   },
 * });
 *
 * <Form onFinish={form.handleSubmit(async (values) => {
 *   await createUser(values);
 *   message.success('创建成功');
 * })}>
 *   <Form.Item name="username">
 *     <Input onChange={form.handleChange('username')} value={form.values.username} />
 *   </Form.Item>
 *   <Button htmlType="submit">提交</Button>
 * </Form>
 * ```
 */
export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>): UseFormReturn<T> {
	const { initialValues, validate, rules } = options;
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

	const handleChange = useCallback((field: keyof T) => (value: any) => {
		setValues(prev => ({ ...prev, [field]: value }));
		// 清除该字段的错误
		setErrors(prev => {
			const newErrors = { ...prev };
			delete newErrors[field];
			return newErrors;
		});
	}, []);

	const setFieldValue = useCallback((field: keyof T, value: any) => {
		setValues(prev => ({ ...prev, [field]: value }));
	}, []);

	const setError = useCallback((field: keyof T, error: string) => {
		setErrors(prev => ({ ...prev, [field]: error }));
	}, []);

	const clearErrors = useCallback(() => {
		setErrors({});
	}, []);

	const reset = useCallback((newValues?: T) => {
		setValues(newValues ?? initialValues);
		setErrors({});
	}, [initialValues]);

	// 验证单个字段
	const validateField = useCallback((field: keyof T, value: any, allValues: T): string | undefined => {
		const fieldRules = rules?.[field];
		if (!fieldRules) return undefined;

		for (const rule of fieldRules) {
			if (rule.required && (!value || value === '')) {
				return rule.message || `${String(field)}是必填项`;
			}
			if (rule.pattern && !rule.pattern.test(value)) {
				return rule.message || `${String(field)}格式不正确`;
			}
			if (rule.min && value.length < rule.min) {
				return rule.message || `${String(field)}至少${rule.min}个字符`;
			}
			if (rule.max && value.length > rule.max) {
				return rule.message || `${String(field)}最多${rule.max}个字符`;
			}
			if (rule.custom) {
				const error = rule.custom(value, allValues);
				if (error) return error;
			}
		}
		return undefined;
	}, [rules]);

	const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => async (e?: React.FormEvent) => {
		e?.preventDefault();

		// 验证所有字段
		const newErrors: Partial<Record<keyof T, string>> = {};

		// 使用规则验证
		if (rules) {
			Object.keys(rules).forEach(field => {
				const error = validateField(field as keyof T, values[field as keyof T], values);
				if (error) {
					newErrors[field as keyof T] = error;
				}
			});
		}

		// 使用自定义验证函数
		if (validate) {
			const customErrors = validate(values);
			Object.assign(newErrors, customErrors);
		}

		setErrors(newErrors);

		// 如果有错误，不提交
		if (Object.keys(newErrors).length > 0) {
			return;
		}

		// 提交表单
		await onSubmit(values);
	}, [values, rules, validate, validateField]);

	return {
		values,
		errors,
		handleChange,
		handleSubmit,
		reset,
		setFieldValue,
		setError,
		clearErrors,
	};
}

/**
 * 简化版表单 Hook（无验证）
 *
 * @example
 * ```tsx
 * const form = useFormSimple({
 *   username: '',
 *   email: '',
 * });
 *
 * <Input value={form.values.username} onChange={e => form.setFieldValue('username', e.target.value)} />
 * <Button onClick={form.handleSubmit(async (values) => {
 *   await createUser(values);
 * })}>提交</Button>
 * ```
 */
export function useFormSimple<T extends Record<string, any>>(initialValues: T): UseFormReturn<T> {
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

	const handleChange = useCallback((field: keyof T) => (value: any) => {
		setValues(prev => ({ ...prev, [field]: value }));
	}, []);

	const setFieldValue = useCallback((field: keyof T, value: any) => {
		setValues(prev => ({ ...prev, [field]: value }));
	}, []);

	const setError = useCallback((field: keyof T, error: string) => {
		setErrors(prev => ({ ...prev, [field]: error }));
	}, []);

	const clearErrors = useCallback(() => {
		setErrors({});
	}, []);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
	}, [initialValues]);

	const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => async () => {
		await onSubmit(values);
	}, [values]);

	return {
		values,
		errors,
		handleChange,
		handleSubmit,
		reset,
		setFieldValue,
		setError,
		clearErrors,
	};
}
